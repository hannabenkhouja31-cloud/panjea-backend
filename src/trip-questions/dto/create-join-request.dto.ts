import { IsNotEmpty, IsString } from 'class-validator';

export class CreateJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}