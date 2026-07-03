using FluentValidation;
using HMS.Application.DTOs.Doctor;

namespace HMS.Application.Validators.Doctor;

public class CreateDoctorDtoValidator : AbstractValidator<CreateDoctorDto>
{
    public CreateDoctorDtoValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Specialization)
            .NotEmpty().WithMessage("Specialization is required.")
            .MaximumLength(100);

        RuleFor(x => x.Qualification)
            .NotEmpty().WithMessage("Qualification is required.")
            .MaximumLength(150);

        RuleFor(x => x.LicenseNumber)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.LicenseNumber));

        RuleFor(x => x.ConsultationFee)
            .GreaterThanOrEqualTo(0).WithMessage("Consultation fee cannot be negative.");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years cannot be negative.")
            .LessThanOrEqualTo(70).WithMessage("Experience years value seems invalid.");
    }
}
