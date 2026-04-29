import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator'
import { RoundStatus } from '../../../entities/round.entity'

export class CreateRoundDto {
  @IsNumber()
  season_year: number

  @IsNumber()
  round_number: number

  @IsString()
  gender: string

  @IsOptional()
  @IsEnum(['Pending', 'Active', 'Completed'] as RoundStatus[])
  status?: RoundStatus
}

export class UpdateRoundDto {
  @IsOptional()
  @IsEnum(['Pending', 'Active', 'Completed'] as RoundStatus[])
  status?: RoundStatus

  @IsOptional()
  start_date?: string

  @IsOptional()
  end_date?: string
}
