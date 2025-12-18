
"use server";

import { summarizeIntegrityReport, type IntegrityReportInput, type IntegrityReportOutput } from "@/ai/flows/summarize-integrity-report";
import { factCheckRepresentative, type FactCheckInput, type FactCheckOutput } from "@/ai/flows/fact-check-representative";


interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function summarizeIntegrityReportAction(
  input: IntegrityReportInput
): Promise<ActionResult<IntegrityReportOutput>> {
  try {
    if (!input.name || !input.newsSummary) {
      return { success: false, error: "Representative name and news summary are required." };
    }
    if (input.newsSummary.length < 50) {
        return { success: false, error: "News summary must be at least 50 characters." };
    }
    if (input.newsSummary.length > 5000) {
        return { success: false, error: "News summary must not exceed 5000 characters." };
    }


    const output = await summarizeIntegrityReport(input);
    return { success: true, data: output };
  } catch (error) {
    console.error("Error in summarizeIntegrityReportAction:", error);
    return { success: false, error: (error as Error).message || "An unexpected error occurred while generating the report." };
  }
}

export async function factCheckRepresentativeAction(
  input: FactCheckInput
): Promise<ActionResult<FactCheckOutput>> {
  try {
    if (!input.name) {
      return { success: false, error: "Representative name is required." };
    }
    const output = await factCheckRepresentative(input);
    return { success: true, data: output };
  } catch (error) {
    console.error("Error in factCheckRepresentativeAction:", error);
    return { success: false, error: (error as Error).message || "An unexpected error occurred while generating the report." };
  }
}
