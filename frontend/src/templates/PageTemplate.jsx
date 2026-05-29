/**
 * ============================================================
 *  ExamArchitect — Page Template
 *  COPY THIS FILE when creating a new page.
 *  Rename the function, update props, and remove unused code.
 *
 *  RULES (see CODING_STANDARDS.md for full details):
 *  1. Always import API_BASE from '../config' — never hard-code URLs.
 *  2. Always attach the Authorization header on protected requests.
 *  3. Never log sensitive data (tokens, passwords) to the console.
 *  4. Wrap every fetch in try/catch; surface errors via addToast.
 *  5. Clean up side-effects in useEffect return functions.
 *  6. Use AbortController so inflight requests cancel on unmount.
 *  7. Sanitize any user-supplied content before rendering as HTML.
 * ============================================================
 */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Project imports ────────────────────────────────────────
import { API_BASE } from '../config';          // ✅ ALWAYS use this
import { useAuth }  from '../context/AuthContext';

// ── PropTypes (optional but strongly encouraged) ──────────
// import PropTypes from 'prop-types';


// ══════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════
/**
 * @param {Function} addToast  – global toast dispatcher from App.jsx
 *                              signature: (message: string, type: 'success'|'error'|'info') => void
 */
export default function PageTemplate({ addToast }) {
  // ── Auth ────────────────────────────────────────────────
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();

  // ── Local state ─────────────────────────────────────────
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Refs ─────────────────────────────────────────────────
  // AbortController ref — cancels inflight fetch on unmount (prevents memory leaks)
  const abortRef = useRef(null);

  // ── Data fetching ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // ✅ Use API_BASE — never hard-code localhost or a production URL
      const res = await fetch(`${API_BASE}/api/your-endpoint`, {
        signal: abortRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          // ✅ Attach token on every protected request
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // ✅ Always check res.ok before calling res.json()
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || `Server error: ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      // Ignore AbortError — it fires when the component unmounts cleanly
      if (err.name === 'AbortError') return;

      // ✅ Never log the token or password fields
      console.error('[PageTemplate] fetchData failed:', err.message);

      setError(err.message);
      // ✅ Surface errors to the user via the global toast
      addToast?.(err.message || 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  // ── Side-effects ──────────────────────────────────────────
  useEffect(() => {
    fetchData();

    // ✅ Cleanup: abort fetch on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);


  // ── Mutation helper (POST / PUT / DELETE) ─────────────────
  const handleSubmit = useCallback(async (formValues) => {
    try {
      const res = await fetch(`${API_BASE}/api/your-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        // ✅ Never send fields the API doesn't need (principle of least privilege)
        body: JSON.stringify({
          field1: formValues.field1,
          field2: formValues.field2,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || 'Request failed');
      }

      const result = await res.json();
      addToast?.('Saved successfully!', 'success');
      return result;
    } catch (err) {
      console.error('[PageTemplate] handleSubmit failed:', err.message);
      addToast?.(err.message || 'Could not save.', 'error');
    }
  }, [token, addToast]);


  // ── Guards ────────────────────────────────────────────────
  // Redirect unauthenticated users before rendering sensitive content.
  // (For route-level protection prefer <ProtectedRoute> in App.jsx instead.)
  // if (!currentUser) {
  //   navigate('/login', { replace: true });
  //   return null;
  // }


  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <div className="glass-panel p-6 text-center" role="alert">
        <p className="text-rose-400 font-semibold mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }


  // ── Main render ───────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 pt-28 animate-fade-in relative z-10">
      {/*
        ✅ Security note:
        NEVER use dangerouslySetInnerHTML with user-supplied content.
        If you must render HTML, sanitize it first:
          import DOMPurify from 'dompurify';
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
      */}

      <h1 className="text-3xl font-display font-bold mb-6">Page Title</h1>

      {/* Render your fetched data here */}
      <pre className="text-slate-300 text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}


// ── PropTypes ─────────────────────────────────────────────
// Uncomment and update when prop-types is available in the project
// PageTemplate.propTypes = {
//   addToast: PropTypes.func,
// };
