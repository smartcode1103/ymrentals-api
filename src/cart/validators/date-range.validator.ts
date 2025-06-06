import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isValidDateRange', async: false })
export class IsValidDateRange implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const { startDate, endDate } = object;

    // Se não há datas, não validar (são opcionais)
    if (!startDate && !endDate) {
      return true;
    }

    // Se apenas uma data está presente, validar individualmente
    if (startDate && !endDate) {
      return this.validateSingleDate(startDate);
    }

    if (!startDate && endDate) {
      return this.validateSingleDate(endDate);
    }

    // Se ambas as datas estão presentes, validar o range
    if (startDate && endDate) {
      return this.validateDateRange(startDate, endDate);
    }

    return true;
  }

  private validateSingleDate(dateString: string): boolean {
    if (!dateString || dateString.trim() === '') {
      return true; // Data vazia é válida (opcional)
    }

    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Verificar se é uma data válida
      if (isNaN(date.getTime())) {
        return false;
      }

      // Verificar se não é anterior a hoje
      if (date < today) {
        return false;
      }

      // Verificar se não é mais de 1 ano no futuro
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (date > oneYearFromNow) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private validateDateRange(startDateString: string, endDateString: string): boolean {
    if (!startDateString || !endDateString || 
        startDateString.trim() === '' || endDateString.trim() === '') {
      return true; // Datas vazias são válidas (opcionais)
    }

    try {
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Verificar se são datas válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }

      // Verificar se a data de início não é anterior a hoje
      if (startDate < today) {
        return false;
      }

      // Verificar se a data de fim não é anterior à data de início
      if (endDate < startDate) {
        return false;
      }

      // Verificar se não são mais de 1 ano no futuro
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (startDate > oneYearFromNow || endDate > oneYearFromNow) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const { startDate, endDate } = object;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Formato de data inválido. Use YYYY-MM-DD.';
      }

      if (start < today) {
        return 'A data de início não pode ser anterior a hoje.';
      }

      if (end < start) {
        return 'A data de fim não pode ser anterior à data de início.';
      }

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (start > oneYearFromNow || end > oneYearFromNow) {
        return 'Não é possível agendar para mais de 1 ano no futuro.';
      }
    }

    if (startDate && !endDate) {
      const start = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(start.getTime())) {
        return 'Formato de data de início inválido. Use YYYY-MM-DD.';
      }

      if (start < today) {
        return 'A data de início não pode ser anterior a hoje.';
      }

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (start > oneYearFromNow) {
        return 'A data de início não pode ser mais de 1 ano no futuro.';
      }
    }

    if (!startDate && endDate) {
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(end.getTime())) {
        return 'Formato de data de fim inválido. Use YYYY-MM-DD.';
      }

      if (end < today) {
        return 'A data de fim não pode ser anterior a hoje.';
      }

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (end > oneYearFromNow) {
        return 'A data de fim não pode ser mais de 1 ano no futuro.';
      }
    }

    return 'Datas inválidas.';
  }
}
