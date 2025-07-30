import { Injectable } from '@nestjs/common';

import { firstValueFrom, take, timer } from 'rxjs';

export enum ELogColor {
  FgRed = 'FgRed',
  FgGreen = 'FgGreen',
  FgYellow = 'FgYellow',
  FgBlue = 'FgBlue',
  FgMagenta = 'FgMagenta',
  FgCyan = 'FgCyan',
}

@Injectable()
export class UtilsService {
  public coloredText(color: ELogColor, text: string): string {
    let prefix = '';
    switch (color) {
      case ELogColor.FgRed:
        prefix = '\x1b[31m';
        break;
      case ELogColor.FgGreen:
        prefix = '\x1b[32m';
        break;
      case ELogColor.FgYellow:
        prefix = '\x1b[33m';
        break;
      case ELogColor.FgBlue:
        prefix = '\x1b[34m';
        break;
      case ELogColor.FgMagenta:
        prefix = '\x1b[35m';
        break;
      case ELogColor.FgCyan:
        prefix = '\x1b[36m';
        break;
      default:
        // 'FgWhite'
        prefix = '\x1b[37m';
    }
    const suffix = '\x1b[0m';
    return `${prefix}${text}${suffix}`;
  }

  public coloredLog(color: ELogColor, text: string) {
    console.log(this.coloredText(color, text));
  }

  public async waitSeconds(ms: number, showLog = false) {
    if (showLog) {
      console.log(`Wait ${ms}ms...`);
    }
    await firstValueFrom(timer(ms).pipe(take(1)));
  }

  public capitalizeWords(text: string): string {
    return text
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Converts a string to camelCase.
   *
   * @param {string} str - The input string.
   * @returns {string} The camelCased string.
   */
  public toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/ (.)/g, (_, chr) => chr.toUpperCase());
  }

  /**
   * Parses a localized number string into a float.
   *
   * Replaces whitespace and converts comma to dot for decimal support.
   *
   * @param {string} str - The input string representing a number.
   * @returns {number} The parsed floating-point number.
   */
  public parseNumber(str: string): number {
    return parseFloat(str.replace(/\s/g, '').replace(',', '.'));
  }

  public getLastElement(input: string, delimiter: string): string {
    if (!input) return input;
    const parts = input.split(delimiter);
    return parts[parts.length - 1];
  }

  public getAllButLast(input: string, delimiter: string): string {
    if (!input) return input;
    const parts = input.split(delimiter);
    if (parts.length <= 1) return input;
    parts.pop();
    return parts.join(delimiter);
  }

  public roundPercent(valeur1: number, valeur2: number): string {
    if (valeur2 === 0) {
      return 'Division par zéro impossible';
    }
    const pourcentage = (valeur1 / valeur2) * 100;
    const pourcentageArrondi = Math.round(pourcentage);
    return `${pourcentageArrondi}%`;
  }

  public getFileExtension(fileName: string): string {
    if (!fileName) return fileName;
    const regex = new RegExp('[^.]+$');
    const extension = fileName.match(regex);
    return extension ? extension[0] : '';
  }

  public extractNumbers(input: string): number[] {
    const matches = input.match(/-?\d+([\s.,]\d+)*([.,]\d+)?/g);

    if (!matches) {
      return [];
    }

    return matches.map((match) =>
      parseFloat(this.cleanNumberFormat(match.replace(/\s/g, ''))),
    );
  }

  public cleanNumberFormat(input: string): string {
    if (!input) {
      return '';
    }

    // Use a regex to clean the input
    // 1. Remove commas used as thousand separators
    // 2. Replace a comma as a decimal separator with a dot
    // 3. Remove any extra dots except the one used as the decimal separator
    const cleanedInput = input
      .replace(/,/g, '.') // Replace all commas with dots
      .replace(/\.(?=.*\.)/g, '') // Remove all dots except the last one
      .replace(/\.([^.]*\.)/g, '.$1'); // Ensure only one dot is kept as the decimal separator

    return cleanedInput;
  }

  /**
   * Removes duplicate items from an array based on a key selector function.
   *
   * @template T
   * @public
   * @param {T[]} array The array to remove duplicates from.
   * @param {(item: T) => string} keySelector A function that returns a unique key for each item.
   * @returns {T[]} A new array with duplicate items removed.
   */
  public removeDuplicates<T>(
    array: T[],
    keySelector: (item: T) => string,
  ): T[] {
    return array.filter(
      (value, index, self) =>
        index === self.findIndex((t) => keySelector(t) === keySelector(value)),
    );
  }

  /**
   * Merges duplicate objects in an array based on a key selector.
   * If a merge function is provided, it will be used to merge objects with the same key.
   * If not, a simple property merge is performed.
   *
   * @template T The type of the objects in the array.
   * @param {T[]} array The input array of objects.
   * @param {(item: T) => string} keySelector A function that extracts a unique key from each object.
   * @param {(acc: T, current: T) => T} [mergeFunction] An optional function that merges two objects with the same key.
   * @returns {T[]} An array of merged objects.
   */
  public mergeDuplicates<T>(
    array: T[],
    keySelector: (item: T) => string,
    mergeFunction?: (acc: T, current: T) => T,
  ): T[] {
    const mergedMap = new Map<string, T>();

    for (const item of array) {
      const key = keySelector(item);
      if (mergedMap.has(key)) {
        if (mergeFunction) {
          mergedMap.set(key, mergeFunction(mergedMap.get(key)!, item));
        } else {
          // If no merge function is provided, simply merge the properties.
          mergedMap.set(key, { ...mergedMap.get(key)!, ...item });
        }
      } else {
        mergedMap.set(key, item);
      }
    }

    return Array.from(mergedMap.values());
  }

  /**
   * Removes accents from a given string.
   * Converts characters like "é" to "e" or "à" to "a".
   *
   * @param {string} str - The input string containing accented characters.
   * @returns {string} - The string without accents.
   */
  public removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Extracts specified properties from an object, including nested properties and array elements.
   *
   * @public
   * @param {any} obj The object from which to extract properties.
   * @param {string[]} keys An array of keys, including nested keys using dot notation (e.g., 'items.regions.fr').
   * @returns {any} A new object containing only the specified properties.
   */
  public pick(obj: any, keys: string[]): any {
    let parts: string[];
    let part: string;
    let currentObj: any;
    let currentRet: any;
    let array: any[];
    let nestedParts: string[];
    let tempRet: any;
    return keys.reduce((ret, key) => {
      parts = key.split('.');
      currentObj = obj;
      currentRet = ret;

      for (let i = 0; i < parts.length; i++) {
        part = parts[i];

        if (currentObj && currentObj.hasOwnProperty(part)) {
          if (i === parts.length - 1) {
            currentRet[part] = currentObj[part];
          } else {
            if (Array.isArray(currentObj[part])) {
              if (!currentRet.hasOwnProperty(part)) {
                currentRet[part] = [];
              }
              array = currentObj[part];
              nestedParts = parts.slice(i + 1);

              array.forEach((item, index) => {
                tempRet = this.pick(item, [nestedParts.join('.')]);

                if (Object.keys(tempRet).length > 0) {
                  if (!currentRet[part][index]) {
                    currentRet[part][index] = {};
                  }

                  currentRet[part][index] = this.deepMerge(
                    {},
                    currentRet[part][index],
                    tempRet,
                  );
                } else {
                  if (!currentRet[part][index]) {
                    currentRet[part][index] = {};
                  }
                }
              });
              break;
            } else {
              currentObj = currentObj[part];
              if (!currentRet.hasOwnProperty(part)) {
                currentRet[part] = {};
              }
              currentRet = currentRet[part];
            }
          }
        } else {
          break;
        }
      }
      return ret;
    }, {});
  }

  /**
   * Creates a deep clone of an object using JSON.parse and JSON.stringify.
   *
   * @template T
   * @param {T} obj The object to clone.
   * @returns {T} A deep clone of the object.
   * @throws {Error} If the object cannot be serialized to JSON.
   */
  public deepCloneJSON<T>(obj: T): T {
    if (obj === undefined) {
      return undefined;
    }
    if (obj === null) {
      return null;
    }
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Checks if a value is a plain object (not null, not an array).
   *
   * @public
   * @param {any} item The value to check.
   * @returns {boolean} True if the value is a plain object, false otherwise.
   */
  public isObject(item: any): boolean {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Merges multiple source objects into a target object, handling nested objects and arrays.
   * Allows source objects to have partial properties of the target object type.
   *
   * @template T extends object
   * @param {T} target The target object to merge into.
   * @param {...Partial<T>[]} sources The source objects to merge.
   * @returns {T} The merged object.
   */
  public deepMerge<T extends object>(
    target: T,
    ...sources: Array<Partial<T>>
  ): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceValue = source[key];
          if (this.isObject(sourceValue) && this.isObject(target[key])) {
            target[key] = this.deepMerge(
              target[key] as any,
              sourceValue as any,
            );
          } else {
            (target as any)[key] = sourceValue;
          }
        }
      }
    }
    return this.deepMerge(target, ...sources);
  }
}
