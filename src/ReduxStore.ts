import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0 },
    reducers: {
        increment: state => { state.value += 1 },
        decrement: state => { state.value -= 1 }
    }
})

export const { increment, decrement } = counterSlice.actions;

const scoreSlice = createSlice({
    name: 'scores',
    initialState: { value: {} as Record<number, number> },
    reducers: {
		setScore: (state, action: PayloadAction<{level: number, score: number}>) => {
			const [level, score] = [action.payload.level, action.payload.score];
			if (!state[level] || state[level]>score) {
				console.log(' ~ Setting score from ', score, state[level]);
				return { ...state, [level]: score }
			} else {
				console.log(' ~ Not setting score from ', score, state[level]);
			}
		}
    }
})

export const { setScore } = scoreSlice.actions;

export const store = configureStore({
    reducer: {
      counter: counterSlice.reducer,
	  scores: scoreSlice.reducer
    }
});