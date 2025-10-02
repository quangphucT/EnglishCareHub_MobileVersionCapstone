import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
}

const initialState: UserState = {
  profile: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    clearUserProfile: (state) => {
      state.profile = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUserProfile, clearUserProfile, setLoading } = userSlice.actions;
export default userSlice.reducer;
