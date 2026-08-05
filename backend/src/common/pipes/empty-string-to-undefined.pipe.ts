import { Injectable, PipeTransform } from '@nestjs/common';

// HTML forms routinely submit "" for an optional field left blank (date inputs,
// text inputs, a conditional field that got unmounted). class-validator's
// @IsOptional() only skips validation for `undefined`/`null`, not "", so an empty
// string on an optional @IsDateString()/@IsEmail()/etc. field fails validation
// even though the user just left it blank. Runs before the ValidationPipe so
// DTOs never see the empty string in the first place.
function stripEmptyStrings(value: any): any {
  if (Array.isArray(value)) {
    for (const item of value) stripEmptyStrings(item);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const v = value[key];
      if (v === '') {
        value[key] = undefined;
      } else if (v && typeof v === 'object') {
        stripEmptyStrings(v);
      }
    }
  }
  return value;
}

@Injectable()
export class EmptyStringToUndefinedPipe implements PipeTransform {
  transform(value: any) {
    return stripEmptyStrings(value);
  }
}
