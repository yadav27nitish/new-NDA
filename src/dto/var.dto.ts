export class ParamsDto {
  uid: string;
  buId: string;
  soId: string;
  cloudId: string;
  isCanary?: number = 0;
  isOpen: number = 1;
  region?: string = 'us-east-1';
  assign?: boolean = true;
}
