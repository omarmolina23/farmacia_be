import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsStrongPasswordValidator } from './is-strong-password.validator';

export function IsStrongPasswordCustom(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordValidator,
    });
  };
}
