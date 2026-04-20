import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "./jobsSlice";
import screeningReducer from "./screeningSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    screening: screeningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
