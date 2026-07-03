using AutoMapper;
using HMS.Application.DTOs.Prescription;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PrescriptionService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PrescriptionDto>> GetAllAsync()
    {
        var prescriptions = await _unitOfWork.PrescriptionRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<PrescriptionDto>>(prescriptions);
    }

    public async Task<PrescriptionDto?> GetByIdAsync(Guid id)
    {
        var prescription = await _unitOfWork.PrescriptionRepository.GetByIdWithDetailsAsync(id);
        return prescription == null ? null : _mapper.Map<PrescriptionDto>(prescription);
    }

    public async Task<IEnumerable<PrescriptionDto>> GetByPatientIdAsync(Guid patientId)
    {
        var all = await _unitOfWork.PrescriptionRepository.GetAllWithDetailsAsync();
        var filtered = all.Where(p => p.PatientId == patientId);
        return _mapper.Map<IEnumerable<PrescriptionDto>>(filtered);
    }

    public async Task<PrescriptionDto> CreateAsync(CreatePrescriptionDto dto)
    {
        var patientExists = await _unitOfWork.Repository<Patient>().ExistsAsync(dto.PatientId);
        if (!patientExists)
        {
            throw new KeyNotFoundException("Patient not found.");
        }

        var doctorExists = await _unitOfWork.Repository<Doctor>().ExistsAsync(dto.DoctorId);
        if (!doctorExists)
        {
            throw new KeyNotFoundException("Doctor not found.");
        }

        if (dto.MedicalRecordId.HasValue)
        {
            var recordExists = await _unitOfWork.Repository<MedicalRecord>().ExistsAsync(dto.MedicalRecordId.Value);
            if (!recordExists)
            {
                throw new KeyNotFoundException("Medical record not found.");
            }
        }

        foreach (var item in dto.Items)
        {
            var medicineExists = await _unitOfWork.Repository<Medicine>().ExistsAsync(item.MedicineId);
            if (!medicineExists)
            {
                throw new KeyNotFoundException($"Medicine with id {item.MedicineId} not found.");
            }
        }

        var prescription = _mapper.Map<Prescription>(dto);
        prescription.Items = dto.Items.Select(i => _mapper.Map<PrescriptionItem>(i)).ToList();

        await _unitOfWork.Repository<Prescription>().AddAsync(prescription);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.PrescriptionRepository.GetByIdWithDetailsAsync(prescription.Id);
        return _mapper.Map<PrescriptionDto>(created);
    }

    public async Task<PrescriptionDto> UpdateAsync(Guid id, UpdatePrescriptionDto dto)
    {
        var prescription = await _unitOfWork.PrescriptionRepository.GetByIdWithDetailsAsync(id);
        if (prescription == null)
        {
            throw new KeyNotFoundException("Prescription not found.");
        }

        foreach (var item in dto.Items)
        {
            var medicineExists = await _unitOfWork.Repository<Medicine>().ExistsAsync(item.MedicineId);
            if (!medicineExists)
            {
                throw new KeyNotFoundException($"Medicine with id {item.MedicineId} not found.");
            }
        }

        prescription.PrescriptionDate = dto.PrescriptionDate;
        prescription.Notes = dto.Notes;

        // Full replace of items
        prescription.Items.Clear();
        foreach (var item in dto.Items)
        {
            prescription.Items.Add(_mapper.Map<PrescriptionItem>(item));
        }

        await _unitOfWork.Repository<Prescription>().UpdateAsync(prescription);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.PrescriptionRepository.GetByIdWithDetailsAsync(id);
        return _mapper.Map<PrescriptionDto>(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<Prescription>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Prescription not found.");
        }
        await _unitOfWork.Repository<Prescription>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}
