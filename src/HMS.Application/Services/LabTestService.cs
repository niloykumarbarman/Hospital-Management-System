using AutoMapper;
using HMS.Application.DTOs.LabTest;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class LabTestService : ILabTestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public LabTestService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<LabTestDto>> GetAllAsync()
    {
        var labTests = await _unitOfWork.LabTestRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<LabTestDto>>(labTests);
    }

    public async Task<LabTestDto?> GetByIdAsync(Guid id)
    {
        var labTest = await _unitOfWork.LabTestRepository.GetByIdWithDetailsAsync(id);
        return labTest == null ? null : _mapper.Map<LabTestDto>(labTest);
    }

    public async Task<IEnumerable<LabTestDto>> GetByPatientIdAsync(Guid patientId)
    {
        var labTests = await _unitOfWork.LabTestRepository.GetByPatientIdAsync(patientId);
        return _mapper.Map<IEnumerable<LabTestDto>>(labTests);
    }

    public async Task<LabTestDto> CreateAsync(CreateLabTestDto dto)
    {
        var patientExists = await _unitOfWork.Repository<Patient>().ExistsAsync(dto.PatientId);
        if (!patientExists)
        {
            throw new KeyNotFoundException("Patient not found.");
        }

        if (dto.MedicalRecordId.HasValue)
        {
            var recordExists = await _unitOfWork.Repository<MedicalRecord>().ExistsAsync(dto.MedicalRecordId.Value);
            if (!recordExists)
            {
                throw new KeyNotFoundException("Medical record not found.");
            }
        }

        var labTest = _mapper.Map<LabTest>(dto);

        await _unitOfWork.Repository<LabTest>().AddAsync(labTest);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.LabTestRepository.GetByIdWithDetailsAsync(labTest.Id);
        return _mapper.Map<LabTestDto>(created);
    }

    public async Task<LabTestDto> UpdateAsync(Guid id, UpdateLabTestDto dto)
    {
        var labTest = await _unitOfWork.LabTestRepository.GetByIdWithDetailsAsync(id);
        if (labTest == null)
        {
            throw new KeyNotFoundException("Lab test not found.");
        }

        labTest.TestName = dto.TestName;
        labTest.TestType = dto.TestType;
        labTest.RequestedDate = dto.RequestedDate;
        labTest.ResultDate = dto.ResultDate;
        labTest.ResultValue = dto.ResultValue;
        labTest.NormalRange = dto.NormalRange;
        labTest.Remarks = dto.Remarks;
        labTest.IsCompleted = dto.IsCompleted;

        await _unitOfWork.Repository<LabTest>().UpdateAsync(labTest);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.LabTestRepository.GetByIdWithDetailsAsync(id);
        return _mapper.Map<LabTestDto>(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<LabTest>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Lab test not found.");
        }
        await _unitOfWork.Repository<LabTest>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}
