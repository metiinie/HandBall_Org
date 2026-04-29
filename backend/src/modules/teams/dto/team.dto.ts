import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator'
import { TeamGender } from '../../../entities/team.entity'

export class CreateTeamDto {
  @IsString()
  name: string

  @IsEnum(['ወንድ', 'ሴት'] as TeamGender[])
  gender: TeamGender

  @IsOptional()
  @IsUrl()
  logo_url?: string
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(['ወንድ', 'ሴት'] as TeamGender[])
  gender?: TeamGender

  @IsOptional()
  @IsUrl()
  logo_url?: string
}
