using DripSyndicate.Application.DTOs;
using FluentValidation;

namespace DripSyndicate.Application.Validators;

public class UpsertProductRequestValidator : AbstractValidator<UpsertProductRequest>
{
    public UpsertProductRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(220).Matches("^[a-z0-9-]+$")
            .WithMessage("Slug must be lowercase, alphanumeric and hyphens.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Currency).NotEmpty().Length(3);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class UpsertCategoryRequestValidator : AbstractValidator<UpsertCategoryRequest>
{
    public UpsertCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Slug).NotEmpty().Matches("^[a-z0-9-]+$");
    }
}

public class UpsertVariantRequestValidator : AbstractValidator<UpsertVariantRequest>
{
    public UpsertVariantRequestValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.StockOnHand).GreaterThanOrEqualTo(0);
    }
}
