import { checkComplianceTool } from '../../src/lib/tools/check-compliance';

interface ProviderOptions {
  id?: string;
  config?: Record<string, unknown>;
}

interface ProviderResponse {
  output?: string;
  error?: string;
}

export default class ComplianceProvider {
  private providerId: string;

  constructor(options: ProviderOptions) {
    this.providerId = options.id || 'compliance-tool';
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    const result = checkComplianceTool(prompt);
    return { output: JSON.stringify(result) };
  }
}
