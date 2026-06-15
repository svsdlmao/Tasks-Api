import { IsOptional, IsString } from 'class-validator';

export class AiHelpDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  userContext?: any;
}
