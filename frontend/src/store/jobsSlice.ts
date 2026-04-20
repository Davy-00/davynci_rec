import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authHeader } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

export interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  description: string;
  responsibilities: string[];
  niceToHave?: string[];
  formQuestions?: { id: string; question: string }[];
  requirements: {
    yearsOfExperience: number;
    requiredSkills: string[];
    preferredSkills?: string[];
  };
  status: "draft" | "active" | "closed";
  createdAt: string;
}

interface JobsState {
  list: Job[];
  selected: Job | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async () => {
  const res = await axios.get(`${API}/jobs`, {
    headers: { Authorization: authHeader() },
  });
  return res.data.data as Job[];
});

export const fetchJob = createAsyncThunk("jobs/fetchOne", async (id: string) => {
  const res = await axios.get(`${API}/jobs/${id}`, {
    headers: { Authorization: authHeader() },
  });
  return res.data.data as Job;
});

export const createJob = createAsyncThunk("jobs/create", async (payload: Omit<Job, "_id" | "createdAt">) => {
  const res = await axios.post(`${API}/jobs`, payload, {
    headers: { Authorization: authHeader() },
  });
  return res.data.data as Job;
});

export const updateJobStatus = createAsyncThunk(
  "jobs/updateStatus",
  async ({ id, status }: { id: string; status: Job["status"] }) => {
    const res = await axios.patch(`${API}/jobs/${id}`, { status }, {
      headers: { Authorization: authHeader() },
    });
    return res.data.data as Job;
  }
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    selectJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch jobs";
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.selected = action.payload;
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex((j) => j._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?._id === action.payload._id) state.selected = action.payload;
      });
  },
});

export const { selectJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
