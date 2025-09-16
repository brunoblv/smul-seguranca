/**
 * Utilitários para formatação de datas em formato brasileiro
 */

/**
 * Formata uma data em formato brasileiro completo (dd/mm/aaaa hh:mm)
 * @param data - String da data ou objeto Date
 * @returns String formatada ou "N/A" se inválida
 */
export function formatarDataBrasileira(
  data: string | Date | null | undefined
): string {
  if (!data) return "N/A";

  try {
    const dataObj = typeof data === "string" ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return "Data inválida";

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Data inválida";
  }
}

/**
 * Formata uma data em formato brasileiro simples (dd/mm/aaaa)
 * @param data - String da data ou objeto Date
 * @returns String formatada ou "N/A" se inválida
 */
export function formatarDataSimples(
  data: string | Date | null | undefined
): string {
  if (!data) return "N/A";

  try {
    const dataObj = typeof data === "string" ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return "Data inválida";

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "Data inválida";
  }
}

/**
 * Formata uma data em formato brasileiro com hora (dd/mm/aaaa hh:mm:ss)
 * @param data - String da data ou objeto Date
 * @returns String formatada ou "N/A" se inválida
 */
export function formatarDataCompleta(
  data: string | Date | null | undefined
): string {
  if (!data) return "N/A";

  try {
    const dataObj = typeof data === "string" ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return "Data inválida";

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return "Data inválida";
  }
}

/**
 * Formata uma data relativa (ex: "há 2 dias", "ontem", "hoje")
 * @param data - String da data ou objeto Date
 * @returns String formatada ou "N/A" se inválida
 */
export function formatarDataRelativa(
  data: string | Date | null | undefined
): string {
  if (!data) return "N/A";

  try {
    const dataObj = typeof data === "string" ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return "Data inválida";

    const agora = new Date();
    const diffEmMs = agora.getTime() - dataObj.getTime();
    const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));

    if (diffEmDias === 0) {
      return "Hoje";
    } else if (diffEmDias === 1) {
      return "Ontem";
    } else if (diffEmDias < 7) {
      return `Há ${diffEmDias} dias`;
    } else if (diffEmDias < 30) {
      const semanas = Math.floor(diffEmDias / 7);
      return semanas === 1 ? "Há 1 semana" : `Há ${semanas} semanas`;
    } else if (diffEmDias < 365) {
      const meses = Math.floor(diffEmDias / 30);
      return meses === 1 ? "Há 1 mês" : `Há ${meses} meses`;
    } else {
      const anos = Math.floor(diffEmDias / 365);
      return anos === 1 ? "Há 1 ano" : `Há ${anos} anos`;
    }
  } catch (error) {
    return "Data inválida";
  }
}

/**
 * Valida se uma string é uma data válida
 * @param data - String da data
 * @returns boolean indicando se é válida
 */
export function isValidDate(data: string | null | undefined): boolean {
  if (!data) return false;

  try {
    const dataObj = new Date(data);
    return !isNaN(dataObj.getTime());
  } catch (error) {
    return false;
  }
}
