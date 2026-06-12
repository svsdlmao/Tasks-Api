import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaskTypeDto {
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsString()
  color: string; // hex color
}
