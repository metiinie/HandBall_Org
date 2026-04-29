import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator'
import { MatchStatus, ForfeitSide } from '../../../entities/match.entity'

export class CreateMatchDto {
  @IsString()
  round_id: string

  @IsString()
  home_team_id: string

  @IsString()
  away_team_id: string

  @IsOptional()
  @IsString()
  venue?: string

  @IsOptional()
  match_date?: string
}

export class UpdateMatchDto {
  @IsOptional()
  @IsString()
  venue?: string

  @IsOptional()
  match_date?: string
}

export class UpdateScoreDto {
  @IsNumber()
  home_score: number

  @IsNumber()
  away_score: number

  @IsOptional()
  @IsBoolean()
  is_ot?: boolean
}

export class ForfeitMatchDto {
  @IsEnum(['home', 'away', 'both'] as ForfeitSide[])
  forfeit_side: ForfeitSide
}
