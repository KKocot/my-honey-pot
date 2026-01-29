/**
 * Localization options for renderer messages and warnings
 */
export class Localization {
  /**
   * Validates localization options
   * @param o - Localization options to validate
   */
  public static validate(o: LocalizationOptions) {
    if (!o || typeof o !== 'object') {
      throw new Error('LocalizationOptions must be an object');
    }
    if (!o.phishingWarning || typeof o.phishingWarning !== 'string') {
      throw new Error('LocalizationOptions.phishingWarning must be a non-empty string');
    }
    if (!o.externalLink || typeof o.externalLink !== 'string') {
      throw new Error('LocalizationOptions.externalLink must be a non-empty string');
    }
    if (!o.noImage || typeof o.noImage !== 'string') {
      throw new Error('LocalizationOptions.noImage must be a non-empty string');
    }
    if (!o.accountNameWrongLength || typeof o.accountNameWrongLength !== 'string') {
      throw new Error('LocalizationOptions.accountNameWrongLength must be a non-empty string');
    }
    if (!o.accountNameBadActor || typeof o.accountNameBadActor !== 'string') {
      throw new Error('LocalizationOptions.accountNameBadActor must be a non-empty string');
    }
    if (!o.accountNameWrongSegment || typeof o.accountNameWrongSegment !== 'string') {
      throw new Error('LocalizationOptions.accountNameWrongSegment must be a non-empty string');
    }
  }

  public static DEFAULT: LocalizationOptions = {
    phishingWarning: 'Link expanded to plain text; beware of a potential phishing attempt',
    externalLink: 'This link will take you away from example.com',
    noImage: 'Images not allowed',
    accountNameWrongLength: 'Account name should be between 3 and 16 characters long',
    accountNameBadActor: 'This account is on a bad actor list',
    accountNameWrongSegment: 'This account name contains a bad segment'
  };
}

export interface LocalizationOptions {
  phishingWarning: string; // "Link expanded to plain text; beware of a potential phishing attempt"
  externalLink: string; // "This link will take you away from example.com"
  noImage: string; // "Images not allowed"
  accountNameWrongLength: string; // "Account name should be between 3 and 16 characters long."
  accountNameBadActor: string; // "This account is on a bad actor list"
  accountNameWrongSegment: string; // "This account name contains a bad segment"
}
