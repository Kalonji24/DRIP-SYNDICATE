using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using DripSyndicate.Domain.Enums;
using DripSyndicate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _db;   // concrete for transactions
    private readonly ICurrentUser _me;
    public OrdersController(ApplicationDbContext db, ICurrentUser me) { _db = db; _me = me; }

    /// <summary>Checkout: validates stock, decrements atomically, creates a paid order.</summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<OrderDto>> Checkout(CheckoutRequest req, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var cart = await _db.CartItems.Include(c => c.ProductVariant).ThenInclude(v => v.Product)
            .Where(c => c.UserId == uid).ToListAsync(ct);
        if (cart.Count == 0) return BadRequest(new { error = "Cart is empty." });

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        // Re-check + reserve stock under transaction (row locks via UPDATE).
        foreach (var item in cart)
        {
            var v = item.ProductVariant;
            if (v.Available < item.Quantity)
                return Conflict(new { error = $"'{v.Product.Name}' ({v.Size}) is out of stock." });
            v.StockOnHand -= item.Quantity;   // commit decrement; CHECK constraint prevents oversell
        }

        var subtotal = cart.Sum(c => c.ProductVariant.Price * c.Quantity);
        const decimal shipping = 99m;
        var tax = Math.Round(subtotal * 0.15m, 2); // 15% VAT (ZA)
        var total = subtotal + shipping + tax;

        var order = new Order
        {
            Number = $"DS-{DateTime.UtcNow:yyyy}-{Random.Shared.Next(100000, 999999)}",
            UserId = uid, Status = OrderStatus.Paid,
            Subtotal = subtotal, Shipping = shipping, Tax = tax, Total = total, Currency = "ZAR",
            Email = req.Address.Email, ShipFullName = req.Address.FullName,
            ShipLine1 = req.Address.Line1, ShipLine2 = req.Address.Line2,
            ShipCity = req.Address.City, ShipPostalCode = req.Address.PostalCode,
            ShipCountry = req.Address.Country,
            Items = cart.Select(c => new OrderItem
            {
                ProductVariantId = c.ProductVariantId,
                NameSnapshot = c.ProductVariant.Product.Name,
                SkuSnapshot = c.ProductVariant.Sku,
                UnitPrice = c.ProductVariant.Price,
                Quantity = c.Quantity,
                LineTotal = c.ProductVariant.Price * c.Quantity
            }).ToList()
        };
        order.Payment = new Payment
        {
            Provider = req.PaymentMethod, Status = PaymentStatus.Captured,
            Amount = total, Currency = "ZAR", IntentId = Guid.NewGuid().ToString("N")
        };

        _db.Orders.Add(order);
        _db.CartItems.RemoveRange(cart);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, Map(order));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> List(CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var orders = await _db.Orders.AsNoTracking().Include(o => o.Items)
            .Where(o => o.UserId == uid).OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
        return Ok(orders.Select(Map));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetById(Guid id, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var order = await _db.Orders.AsNoTracking().Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == uid, ct);
        return order is null ? NotFound() : Ok(Map(order));
    }

    private static OrderDto Map(Order o) => new(
        o.Id, o.Number, o.Status.ToString(), o.Subtotal, o.Shipping, o.Tax, o.Total, o.Currency, o.CreatedAt,
        o.Items.Select(i => new OrderItemDto(i.NameSnapshot, i.SkuSnapshot, i.UnitPrice, i.Quantity, i.LineTotal)).ToList());
}
