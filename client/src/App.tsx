import React, { useEffect, useState } from 'react'
import { Button, Icon, CssBaseline, Grid } from '@material-ui/core/'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import RubricEditor from './RubricEditor'
import RubricView from './RubricView'
import * as O from 'optics-ts'
import {
  AppState,
  LanguageCode,
  SectionType,
  SelectionType,
  SliderCriterionAppState,
  SliderCriterionType,
} from './types'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { swapElements } from './array-utils'
import MainMenu from './MainMenu'

const emptyAppState: AppState = {
  sections: [],
  selection: '',
  language: '',
  showRubricEditor: false,
  version: 1,
  dirty: false,
}

const sectionsLens = O.optic<AppState>().prop('sections')
const languageLens = O.optic<AppState>().prop('language')
const showRubricEditorLens = O.optic<AppState>().prop('showRubricEditor')
const versionLens = O.optic<AppState>().prop('version')
const dirtyLens = O.optic<AppState>().prop('dirty')
const selectionLens = O.optic<AppState>().prop('selection')

const sectionPrism = (sectionIndex: number) => sectionsLens.index(sectionIndex)

const newSectionSetter = O.optic<AppState>().prop('sections').appendTo()

const theme = createMuiTheme({
  palette: {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff1744' },
    background: { default: '#ffffff' },
  },
})

const setSelectionEnabled = (enabled: boolean) => {
  const elementId = 'content'
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('could not get element', elementId)
    return
  }
  element.className = enabled ? '' : 'noselect'
}

const deselectAll = () => {
  const selection = window.getSelection()
  if (!selection) {
    return
  }
  selection.removeAllRanges()
  setSelectionEnabled(false)
}

const selectElement = (elementId: string) => () => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('could not get element', elementId)
    return
  }
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  if (!selection) {
    return
  }
  selection.removeAllRanges()
  setSelectionEnabled(true)
  selection.addRange(range)
  document.execCommand('copy')
}

const App = (): JSX.Element => {
  const [appState, setAppState] = useState(emptyAppState)
  const { t } = useTranslation()

  React.useEffect(() => {
    setSelectionEnabled(false)
  })

  const cleanAppState = (): void => {
    setAppState(O.set(dirtyLens)(false)(appState))
  }

  const changeAppState = (newAppState: AppState): void => {
    if (appState.dirty) {
      setAppState(newAppState)
    } else {
      setAppState(O.set(dirtyLens)(true)(newAppState))
    }
  }

  const addSection = (): void => {
    changeAppState(
      O.set(newSectionSetter)({
        title: '',
        criterions: [],
      })(appState)
    )
  }

  const removeSection = (sectionIndex: number): void => {
    if (sectionIndex >= appState.sections.length - 1) {
      console.error(`Cannot remove section at ${sectionIndex}`)
    }
    changeAppState(O.remove(sectionPrism(sectionIndex))(appState))
  }

  const editSection = (sectionIndex: number) => (section: SectionType) => {
    changeAppState(O.set(sectionPrism(sectionIndex))(section)(appState))
  }

  const moveSectionUp = (sectionIndex: number): void => {
    if (sectionIndex < 1) {
      console.error(`Cannot move up section at ${sectionIndex}`)
      return
    }
    moveSectionDown(sectionIndex - 1)
  }

  const moveSectionDown = (sectionIndex: number): void => {
    if (sectionIndex >= appState.sections.length) {
      console.error(`Cannot move down section at ${sectionIndex}`)
      return
    }
    const newSections = swapElements(sectionIndex, appState.sections)
    changeAppState(O.set(sectionsLens)(newSections)(appState))
  }

  const setSelection = (selection: SelectionType) => {
    setAppState(O.set(selectionLens)(selection)(appState))
  }

  useEffect(() => {
    if (appState.selection === 'deselect') {
      deselectAll()
      setSelection('')
    } else if (appState.selection === 'select') {
      selectElement('content')()
    }
  }, [appState.selection])

  const changeLanguage = (language: LanguageCode): void => {
    i18n.changeLanguage(language)
    setAppState(O.set(languageLens)(language)(appState))
  }

  const toggleRubricEditor = (): void => {
    setAppState(
      O.set(showRubricEditorLens)(!appState.showRubricEditor)(appState)
    )
  }

  // TODO this function contains ugly hack
  const setSliderRowValue = (sectionIndex: number, criterionIndex: number) => (
    rowIndex: number,
    value: number
  ): void => {
    const valuePrism = O.optic<SliderCriterionAppState>()
      .prop('sections')
      .index(sectionIndex)
      .prop('criterions')
      .index(criterionIndex)
      .prop('criterion')
      .prop('rows')
      .index(rowIndex)
      .prop('value')
    setAppState(O.set(valuePrism)(value)(appState as SliderCriterionAppState))
  }

  const setSectionsAndCleanAppState = (sections: SectionType[]): void => {
    setAppState(
      O.set(sectionsLens)(sections)(
        O.set(dirtyLens)(false)(O.set(selectionLens)('deselect')(appState))
      )
    )
  }

  // TODO please implement this function with lenses
  const reset = (): void => {
    const appStateWithUpdatedVersion = O.set(versionLens)(appState.version + 1)(
      appState
    )
    appStateWithUpdatedVersion.selection = 'deselect'
    appStateWithUpdatedVersion.sections.forEach((section: SectionType) =>
      section.criterions.forEach((criterion) => {
        if (criterion.type === 'SliderCriterion') {
          const sliderCriterion = criterion.criterion as SliderCriterionType
          sliderCriterion.rows.forEach((row) => (row.value = -1))
        }
      })
    )
    setAppState(appStateWithUpdatedVersion)
  }

  return (
    <React.Fragment>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Grid container direction="row" spacing={2}>
          <Grid
            item
            xs={appState.showRubricEditor ? 6 : 1}
            style={{
              transitionDuration: '0.5s',
              transitionProperty: 'flex-basis width',
            }}
          >
            <RubricEditor
              appState={appState}
              addSection={addSection}
              removeSection={removeSection}
              editSection={editSection}
              moveSectionUp={moveSectionUp}
              moveSectionDown={moveSectionDown}
              t={t}
              toggleRubricEditor={toggleRubricEditor}
            />
          </Grid>
          <Grid
            item
            xs={appState.showRubricEditor ? 6 : 11}
            style={{
              transitionDuration: '0.5s',
              transitionProperty: 'flex-basis width',
            }}
          >
            <Grid container spacing={2} className="rubricViewPanel">
              <Grid item xs={12}>
                <MainMenu
                  appState={appState}
                  language={i18n.language}
                  toggleRubricEditor={toggleRubricEditor}
                  setSectionsAndCleanAppState={setSectionsAndCleanAppState}
                  changeLanguage={changeLanguage}
                  cleanAppState={cleanAppState}
                  t={t}
                />
              </Grid>
              <Grid item xs={12}>
                <div id="content">
                  <RubricView
                    sections={appState.sections}
                    selection={appState.selection}
                    version={appState.version}
                    setSliderRowValue={setSliderRowValue}
                    t={t}
                  />
                </div>
              </Grid>
              <Grid item xs={12}>
                <Grid container>
                  {!appState.selection && (
                    <Grid item xs={6}>
                      <Button
                        onClick={() => setSelection('select')}
                        variant="contained"
                        color="primary"
                        startIcon={<Icon>content_copy</Icon>}
                      >
                        {t('selectAndCopy')}
                      </Button>
                    </Grid>
                  )}
                  {appState.selection && (
                    <Grid item xs={6}>
                      <Button
                        onClick={() => setSelection('deselect')}
                        variant="contained"
                        color="primary"
                        startIcon={<Icon>clear</Icon>}
                      >
                        {t('deselect')}
                      </Button>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <Button
                      onClick={reset}
                      variant="outlined"
                      color="secondary"
                      startIcon={<Icon>delete_forever</Icon>}
                    >
                      {t('reset')}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </ThemeProvider>
    </React.Fragment>
  )
}

export default App
