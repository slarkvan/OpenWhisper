type WhisperOutputType = {
  engine?: string;
  model: {
    audio?: {
      cts: number;
      head: number;
      layer: number;
      state: number;
    };
    ftype?: number;
    mels?: number;
    multilingual?: number;
    text?: {
      cts: number;
      head: number;
      layer: number;
      state: number;
    };
    type: string;
    vocab?: number;
  };
  params: {
    language: string;
    model: string;
    translate: boolean;
  };
  result: {
    languate: string;
  };
  systeminfo: string;
  transcription: TranscriptionResultSegmentType[];
};

type TranscriptionResultSegmentType = {
  offsets: {
    from: number;
    to: number;
  };
  text: string;
  timestamps: {
    from: string;
    to: string;
  };
};
