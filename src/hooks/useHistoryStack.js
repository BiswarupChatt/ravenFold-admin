// src/hooks/useHistoryStack.js
import { useState, useRef } from "react";

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export default function useHistoryStack(initialState) {
    const [state, setState] = useState(initialState);
    const historyRef = useRef([]);
    const futureRef = useRef([]);
    const isBatchingRef = useRef(false);
    const batchStartRef = useRef(null);

    const setWithHistory = (updater) => {
        setState((prev) => {
            const prevSnapshot = deepClone(prev);

            // If not batching, record each change as a separate step
            if (!isBatchingRef.current) {
                historyRef.current.push(prevSnapshot);
                futureRef.current = [];
            }

            const nextState =
                typeof updater === "function" ? updater(prev) : updater;

            return nextState;
        });
    };

    const beginBatch = () => {
        if (!isBatchingRef.current) {
            isBatchingRef.current = true;
            batchStartRef.current = deepClone(state);
            futureRef.current = [];
        }
    };

    const endBatch = () => {
        if (isBatchingRef.current && batchStartRef.current) {
            historyRef.current.push(batchStartRef.current);
            batchStartRef.current = null;
        }
        isBatchingRef.current = false;
    };

    const undo = () => {
        if (historyRef.current.length === 0) return;

        setState((current) => {
            const prev = historyRef.current.pop();
            const currentSnapshot = deepClone(current);
            futureRef.current.unshift(currentSnapshot);
            return prev;
        });
    };

    const redo = () => {
        if (futureRef.current.length === 0) return;

        setState((current) => {
            const next = futureRef.current.shift();
            const currentSnapshot = deepClone(current);
            historyRef.current.push(currentSnapshot);
            return next;
        });
    };

    return {
        state,
        setState: setWithHistory,
        undo,
        redo,
        beginBatch,
        endBatch,
    };
}
