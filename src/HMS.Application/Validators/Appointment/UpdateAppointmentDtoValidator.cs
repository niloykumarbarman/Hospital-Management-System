using FluentValidation;
using HMS.Application.DTOs.Appointment;

namespace HMS.Application.Validators.Appointment;

public class UpdateAppointmentDtoValidator : AbstractValidator<UpdateAppointmentDto>
{
    public UpdateAppointmentDtoValidator()
    {
        RuleFor(x => x.AppointmentDate)
            .NotEmpty().WithMessage("Appointment date is required.");

        RuleFor(x => x.AppointmentTime)
            .NotEmpty().WithMessage("Appointment time is required.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid appointment status.");

        RuleFor(x => x.ReasonForVisit)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.ReasonForVisit));

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
