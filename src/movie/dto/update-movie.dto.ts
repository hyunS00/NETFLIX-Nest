import {
  IsNotEmpty,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// enum MovieGenre {
//   Fantasy = 'fantasy',
//   Action = 'action',
// }

// @ValidatorConstraint({
//   async: true,
// })
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(value: any): Promise<boolean> | boolean {
//     // 비밀번호 길ㅣㅡㄴ 4-8
//     return value.length >= 4 && value.length < 8;
//   }
//   defaultMessage?(): string {
//     return '비밀번호의 길이는 4~8자 여야합니다. 입력된 비밀번호:($value)';
//   }
// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     });
//   };
// }
export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // null || undefined이면 안됨
  // @IsDefined()
  // @IsOptional()
  // @Equals('hyunSoo')
  // @NotEquals('hyunSoo')
  // null || undefined || ''
  // @IsEmpty()
  // @IsNotEmpty()
  // Array
  // @IsIn(['action', 'fantasy'])
  // @IsNotIn(['action', 'fantasy'])
  // @IsBoolean()
  // @IsString()
  // @IsNumber()
  // @IsInt()
  // @IsArray()
  // @IsEnum(MovieGenre)
  // @IsDateString()
  // @IsDivisibleBy(5)
  // @IsPositive()
  // @IsNegative()
  // @Min(50)
  // @Max(100)
  // @Contains('hyunsoo')
  // @NotContains('hyunsoo')
  // @IsAlphanumeric()
  // @IsCreditCard()
  // @IsHexColor()
  // @MaxLength(10)
  // @MinLength(5)
  // @IsUUID()
  // @IsLatLong()
  // @IsPasswordValid()
  // test: string;
}
