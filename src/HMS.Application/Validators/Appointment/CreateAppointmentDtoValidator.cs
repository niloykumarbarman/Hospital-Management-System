using FluentValidation;
using HMS.Application.DTOs.Appointment;

namespace HMS.Application.Validators.Appointment;

public class CreateAppointmentDtoValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentDtoValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("PatientId is required.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("DoctorId is required.");

        RuleFor(x => x.AppointmentDate)
            .NotEmpty().WithMessage("Appointment date is required.")
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Appointment date cannot be in the past.");

        RuleFor(x => x.AppointmentTime)
            .NotEmpty().WithMessage("Appointment time is required.");

        RuleFor(x => x.ReasonForVisit)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.ReasonForVisit));
    }
}
