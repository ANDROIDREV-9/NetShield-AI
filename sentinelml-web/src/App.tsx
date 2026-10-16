import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { PageSkeleton, ErrorState } from './components/ui/States'
import { Button } from './components/ui/Button'

const Overview = lazy(() => import('./pages/Overview'))
const DatasetExplorer = lazy(() => import('./pages/DatasetExplorer'))
const Preprocessing = lazy(() => import('./pages/Preprocessing'))
const Classification = lazy(() => import('./pages/Classification'))
const Regression = lazy(() => import('./pages/Regression'))
const Clustering = lazy(() => import('./pages/Clustering'))
const Comparison = lazy(() => import('./pages/Comparison'))
const Predictor = lazy(() => import('./pages/Predictor'))
const Explainability = lazy(() => import('./pages/Explainability'))
const Presentation = lazy(() => import('./pages/Presentation'))
const Roadmap = lazy(() => import('./pages/Roadmap'))

class Boundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {}
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(e: Error, i: ErrorInfo) { console.error('Page error', e, i) }
  render() {
    return this.state.err ? <ErrorState title="This page failed to render" body={this.state.err.message} onRetry={() => this.setState({ err: undefined })} /> : this.props.children
  }
}
function NotFound() {
  return <div className="mx-auto mt-16 max-w-sm text-center"><p className="font-mono text-4xl text-cyan">404</p><p className="mt-2 text-sm text-muted">That route does not exist.</p><Link to="/"><Button className="mt-4" variant="primary">Back to overview</Button></Link></div>
}

export function App() {
  return (
    <Boundary>
      <Suspense fallback={<div className="p-4"><PageSkeleton /></div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="dataset" element={<DatasetExplorer />} />
            <Route path="preprocessing" element={<Preprocessing />} />
            <Route path="classification" element={<Classification />} />
            <Route path="regression" element={<Regression />} />
            <Route path="clustering" element={<Clustering />} />
            <Route path="comparison" element={<Comparison />} />
            <Route path="predictor" element={<Predictor />} />
            <Route path="explainability" element={<Explainability />} />
            <Route path="presentation" element={<Presentation />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="overview" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Boundary>
  )
}
