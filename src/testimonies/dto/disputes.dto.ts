export class RaiseDisputeDto {
    reason: string;
}

export class ResolveDisputeDto {
    outcome: 'approved' | 'rejected';
}
