namespace DripSyndicate.Domain.Enums;

public enum ProductStatus { Draft = 0, Active = 1, Archived = 2 }

public enum OrderStatus
{
    Created = 0, Paid = 1, Fulfilled = 2, Shipped = 3,
    Delivered = 4, Cancelled = 5, Refunded = 6, Returned = 7
}

public enum PaymentStatus { Pending = 0, Authorized = 1, Captured = 2, Failed = 3, Refunded = 4 }

public enum MediaType { Image = 0, Video = 1, Thumbnail = 2 }

public enum MediaScope { Banner = 0, Product = 1, Promo = 2, Category = 3, Other = 4 }
