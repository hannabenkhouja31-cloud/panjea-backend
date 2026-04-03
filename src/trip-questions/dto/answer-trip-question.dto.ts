import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerTripQuestionDto {
  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsString()
  @IsNotEmpty()
  organizerId: string;

  @IsString()
  @IsNotEmpty()
  askerId: string;

  @IsString()
  @IsNotEmpty()
  relatedQuestionId: string;
}