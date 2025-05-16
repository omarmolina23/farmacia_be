import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { isStartBeforeOrEqualToEnd } from '../validators/date-range.validator';

export class DateRangeDto {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate({ message: 'startDate must be a valid date' })
  @isStartBeforeOrEqualToEnd('endDate', {
    message: 'startDate must be before endDate',
  })
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate({ message: 'endDate must be a valid date' })
  endDate: Date;
}