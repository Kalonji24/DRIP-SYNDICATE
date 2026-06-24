using DripSyndicate.Domain.Common;
using DripSyndicate.Domain.Enums;

namespace DripSyndicate.Domain.Entities;

public class CartItem : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = default!;
    public int Quantity { get; set; }
}

public class WishlistItem : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
}

public class Order : BaseEntity
{
    public string Number { get; set; } = default!;      // DS-2026-000123
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Created;

    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Shipping { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "ZAR";

    // shipping snapshot
    public string ShipFullName { get; set; } = default!;
    public string ShipLine1 { get; set; } = default!;
    public string? ShipLine2 { get; set; }
    public string ShipCity { get; set; } = default!;
    public string ShipPostalCode { get; set; } = default!;
    public string ShipCountry { get; set; } = "ZA";
    public string Email { get; set; } = default!;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Payment? Payment { get; set; }
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;
    public Guid ProductVariantId { get; set; }
    public string NameSnapshot { get; set; } = default!;
    public string? SkuSnapshot { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;
    public string Provider { get; set; } = "stripe";
    public string? IntentId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "ZAR";
}

public class Review : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public int Rating { get; set; }                     // 1..5
    public string? Title { get; set; }
    public string? Body { get; set; }
    public bool IsApproved { get; set; }
    public bool VerifiedPurchase { get; set; }
}

public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public string Message { get; set; } = default!;
    public bool IsHandled { get; set; }
}
