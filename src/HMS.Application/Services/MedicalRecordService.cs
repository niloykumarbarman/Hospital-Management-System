using AutoMapper;
using HMS.Application.DTOs.MedicalRecord;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public MedicalRecordService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MedicalRecordDto>> GetAllAsync()
    {
        var records = await _unitOfWork.MedicalRecordRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<MedicalRecordDto>>(records);
    }

    public async Task<MedicalRecordDto?> GetByIdAsync(Guid id)
    {
        var record = await _unitOfWork.MedicalRecordRepository.GetByIdWithDetailsAsync(id);
        return record == null ? null : _mapper.Map<MedicalRecordDto>(record);
    }

    public async Task<IEnumerable<MedicalRecordDto>> GetByPatientIdAsync(Guid patientId)
    {
        var records = await _unitOfWork.MedicalRecordRepository.GetByPatientIdAsync(patientId);
        return _mapper.Map<IEnumerable<MedicalRecordDto>>(records);
    }

    public async Task<MedicalRecordDto> CreateAsync(CreateMedicalRecordDto dto)
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

        var record = _mapper.Map<MedicalRecord>(dto);
        await _unitOfWork.Repository<MedicalRecord>().AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.MedicalRecordRepository.GetByIdWithDetailsAsync(record.Id);
        return _mapper.Map<MedicalRecordDto>(created);
    }

    public async Task<MedicalRecordDto> UpdateAsync(Guid id, UpdateMedicalRecordDto dto)
    {
        var record = await _unitOfWork.Repository<MedicalRecord>().GetByIdAsync(id);
        if (record == null)
        {
            throw new KeyNotFoundException("Medical record not found.");
        }

        _mapper.Map(dto, record);
        await _unitOfWork.Repository<MedicalRecord>().UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.MedicalRecordRepository.GetByIdWithDetailsAsync(id);
        return _mapper.Map<MedicalRecordDto>(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<MedicalRecord>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Medical record not found.");
        }
        await _unitOfWork.Repository<MedicalRecord>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}
