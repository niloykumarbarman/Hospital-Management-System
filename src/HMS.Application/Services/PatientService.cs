using AutoMapper;
using HMS.Application.DTOs.Patient;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class PatientService : IPatientService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public PatientService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<IEnumerable<PatientDto>> GetAllAsync()
    {
        var patients = await _unitOfWork.Repository<Patient>().GetAllAsync();
        return _mapper.Map<IEnumerable<PatientDto>>(patients);
    }
    public async Task<PatientDto?> GetByIdAsync(Guid id)
    {
        var patient = await _unitOfWork.Repository<Patient>().GetByIdAsync(id);
        return patient == null ? null : _mapper.Map<PatientDto>(patient);
    }
    public async Task<PatientDto> CreateAsync(CreatePatientDto dto)
    {
        var patient = _mapper.Map<Patient>(dto);

        // Use total-ever-created count (including soft-deleted) to guarantee a unique PatientCode
        var totalCreated = await _unitOfWork.PatientRepository.GetTotalCreatedCountAsync();
        var nextNumber = totalCreated + 1;
        patient.PatientCode = $"PT-{nextNumber:D5}";

        await _unitOfWork.Repository<Patient>().AddAsync(patient);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<PatientDto>(patient);
    }
    public async Task<PatientDto> UpdateAsync(Guid id, UpdatePatientDto dto)
    {
        var patient = await _unitOfWork.Repository<Patient>().GetByIdAsync(id);
        if (patient == null)
        {
            throw new KeyNotFoundException("Patient not found.");
        }
        _mapper.Map(dto, patient);
        await _unitOfWork.Repository<Patient>().UpdateAsync(patient);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<PatientDto>(patient);
    }
    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<Patient>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Patient not found.");
        }
        await _unitOfWork.Repository<Patient>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}
