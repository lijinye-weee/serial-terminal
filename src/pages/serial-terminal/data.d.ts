export interface SerialForm {
  port: number;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  textDecoder: boolean;
}

export interface PortSelectOption {
  label: string;
  value: number;
  port: any;
}