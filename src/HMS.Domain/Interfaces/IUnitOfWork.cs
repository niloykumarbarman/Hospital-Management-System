namespace HMS.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<T> Repository<T>() where T : Common.BaseEntity;
    IPatientRepository PatientRepository { get; }
    IDoctorRepository DoctorRepository { get; }
    IAppointmentRepository AppointmentRepository { get; }
    IMedicalRecordRepository MedicalRecordRepository { get; }
    IPrescriptionRepository PrescriptionRepository { get; }
    ILabTestRepository LabTestRepository { get; }
    IMedicineRepository MedicineRepository { get; }
    IStockAdjustmentRepository StockAdjustmentRepository { get; }
    IInvoiceRepository InvoiceRepository { get; }
    IUserRepository UserRepository { get; }
    Task<int> SaveChangesAsync();
}
