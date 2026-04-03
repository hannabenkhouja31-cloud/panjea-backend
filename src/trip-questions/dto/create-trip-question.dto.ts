import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTripQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()

  askerId: string; 
}