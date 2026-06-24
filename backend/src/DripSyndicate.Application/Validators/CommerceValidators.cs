using DripSyndicate.Application.DTOs;
using FluentValidation;

namespace DripSyndicate.Application.Validators;

public class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequest>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(x => x.ProductVariantId).NotEmpty();
        RuleFor(x => x.Quantity).InclusiveBetween(1, 10);
    }
}

public class CheckoutRequestValidator : AbstractValidator<CheckoutRequest>
{
    public CheckoutRequestValidator()
    {
        RuleFor(x => x.Address.FullName).NotEmpty();
        RuleFor(x => x.Address.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Address.Line1).NotEmpty();
        RuleFor(x => x.Address.City).NotEmpty();
        RuleFor(x => x.Address.PostalCode).NotEmpty();
        RuleFor(x => x.Address.Country).NotEmpty().Length(2);
        RuleFor(x => x.PaymentMethod).NotEmpty();
    }
}

public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Body).MaximumLength(4000);
    }
}

public class ContactRequestValidator : AbstractValidator<ContactRequest>
{
    public ContactRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(5000);
    }
}
