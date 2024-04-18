type WhisperConfigType = {
  service: "local";
  availableModels: {
    type: string;
    name: string;
    size: string;
    url: string;
    savePath: string;
  }[];
  modelsPath: string;
  model: string;
  ready?: boolean;
};
