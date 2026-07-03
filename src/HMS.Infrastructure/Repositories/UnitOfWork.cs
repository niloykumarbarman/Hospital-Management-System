using System.Collections.Concurrent;
using HMS.Domain.Common;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;

namespace HMS.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ConcurrentDictionary<Type, object> _repositories = new();
    private IPatientRepository? _patientRepository;
    private IDoctorRepository? _doctorRepository;
    private IAppointmentRepository? _appointmentRepository;
    private IMedicalRecordRepository? _medicalRecordRepository;
    private IPrescriptionRepository? _prescriptionRepository;
    private ILabTestRepository? _labTestRepository;
    private IMedicineRepository? _medicineRepository;
    private IStockAdjustmentRepository? _stockAdjustmentRepository;
    private IInvoiceRepository? _invoiceRepository;
    private IUserRepository? _userRepository;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IGenericRepository<T> Repository<T>() where T : BaseEntity
    {
        var type = typeof(T);
        if (!_repositories.ContainsKey(type))
        {
            var repositoryInstance = new GenericRepository<T>(_context);
            _repositories[type] = repositoryInstance;
        }
        return (IGenericRepository<T>)_repositories[type];
    }

    public IPatientRepository PatientRepository
    {
        get
        {
            _patientRepository ??= new PatientRepository(_context);
            return _patientRepository;
        }
    }

    public IDoctorRepository DoctorRepository
    {
        get
        {
            _doctorRepository ??= new DoctorRepository(_context);
            return _doctorRepository;
        }
    }

    public IAppointmentRepository AppointmentRepository
    {
        get
        {
            _appointmentRepository ??= new AppointmentRepository(_context);
            return _appointmentRepository;
        }
    }

    public IMedicalRecordRepository MedicalRecordRepository
    {
        get
        {
            _medicalRecordRepository ??= new MedicalRecordRepository(_context);
            return _medicalRecordRepository;
        }
    }

    public IPrescriptionRepository PrescriptionRepository
    {
        get
        {
            _prescriptionRepository ??= new PrescriptionRepository(_context);
            return _prescriptionRepository;
        }
    }

    public ILabTestRepository LabTestRepository
    {
        get
        {
            _labTestRepository ??= new LabTestRepository(_context);
            return _labTestRepository;
        }
    }

    public IMedicineRepository MedicineRepository
    {
        get
        {
            _medicineRepository ??= new MedicineRepository(_context);
            return _medicineRepository;
        }
    }

    public IStockAdjustmentRepository StockAdjustmentRepository
    {
        get
        {
            _stockAdjustmentRepository ??= new StockAdjustmentRepository(_context);
            return _stockAdjustmentRepository;
        }
    }

    public IInvoiceRepository InvoiceRepository
    {
        get
        {
            _invoiceRepository ??= new InvoiceRepository(_context);
            return _invoiceRepository;
        }
    }

    public IUserRepository UserRepository
    {
        get
        {
            _userRepository ??= new UserRepository(_context);
            return _userRepository;
        }
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
