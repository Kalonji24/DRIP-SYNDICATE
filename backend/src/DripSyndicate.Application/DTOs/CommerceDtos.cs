namespace DripSyndicate.Application.DTOs;

public record AddCartItemRequest(Guid ProductVariantId, int Quantity);
public record UpdateCartItemRequest(int Quantity);
public record CartItemDto(Guid Id, Guid ProductVariantId, string ProductName, string? Size, string? Color,
    decimal UnitPrice, int Quantity, decimal LineTotal, string? ImageUrl);
public record CartDto(IReadOnlyList<CartItemDto> Items, decimal Subtotal, string Currency);

public record AddWishlistRequest(Guid ProductId);
public record WishlistItemDto(Guid Id, Guid ProductId, string ProductName, string Slug, decimal Price, string? ImageUrl);

public record CheckoutAddress(string FullName, string Email, string Line1, string? Line2,
    string City, string PostalCode, string Country);
public record CheckoutRequest(CheckoutAddress Address, string PaymentMethod);

public record OrderItemDto(string Name, string? Sku, decimal UnitPrice, int Quantity, decimal LineTotal);
public record OrderDto(Guid Id, string Number, string Status, decimal Subtotal, decimal Shipping,
    decimal Tax, decimal Total, string Currency, DateTime CreatedAt, IReadOnlyList<OrderItemDto> Items);

public record CreateReviewRequest(int Rating, string? Title, string? Body);
public record ReviewDto(Guid Id, int Rating, string? Title, string? Body, string Author,
    bool VerifiedPurchase, DateTime CreatedAt);

public record ContactRequest(string Name, string Email, string Subject, string Message);
