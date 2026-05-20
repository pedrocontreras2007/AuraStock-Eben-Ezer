import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'quantityFormat',
  standalone: true
})
export class QuantityFormatPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: number | string | null | undefined): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || isNaN(Number(trimmed))) {
        return value;
      }
      return formatNumber(Number(trimmed), this.locale, '1.0-0');
    }

    return formatNumber(value, this.locale, '1.0-0');
  }
}
