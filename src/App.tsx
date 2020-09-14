import React, {
  ChangeEvent,
  MutableRefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Button,
  Icon,
  Link,
  CssBaseline,
  Grid,
  Select,
  MenuItem,
  FormControl,
} from '@material-ui/core/'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import RubricEditor from './RubricEditor'
import RubricView from './RubricView'
import * as O from 'optics-ts'
import { AppState, SectionType, SelectionType } from './types'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'

const emptyAppState: AppState = {
  sections: [],
  selection: null,
  language: '',
}

const rubricSelectionLens = O.optic<AppState>().prop('selection')

const sectionsLens = O.optic<AppState>().prop('sections')

const languageLens = O.optic<AppState>().prop('language')

const sectionPrism = (sectionIndex: number) => sectionsLens.index(sectionIndex)

const newSectionSetter = O.optic<AppState>().prop('sections').appendTo()

const theme = createMuiTheme({
  palette: {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff1744' },
    background: { default: '#ffffff' },
  },
})

const reload = () => {
  document.location.reload()
}

const setSelectionEnabled = (enabled: boolean) => {
  const elementId = 'content'
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('could not get element', elementId)
    return
  }
  element.className = enabled ? '' : 'noselect'
}

const unselectAll = () => {
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

const App = (): ReactNode => {
  const [appState, setAppState] = useState(emptyAppState)
  const { t } = useTranslation()

  React.useEffect(() => {
    setSelectionEnabled(false)
  })

  const uploadRubric = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!event.target.files) {
      return
    }
    const file = event.target.files.item(0)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e || !e.target || !e.target.result) {
          console.warn('Could not read file')
          return
        }
        const data = e.target.result
        if (typeof data !== 'string') {
          console.warn('Could not parse file')
          return
        }
        const sections = JSON.parse(data)
        console.log(
          `TODO remove this logging: sections: ${JSON.stringify(
            sections,
            null,
            2
          )}`
        )
        setAppState(O.set(sectionsLens)(sections)(appState))
      }
      reader.readAsText(file)
    }
  }

  const addSection = (): void => {
    setAppState(
      O.set(newSectionSetter)({
        title: '',
        criterions: [],
      })(appState)
    )
  }

  const removeSection = (sectionIndex: number): void => {
    setAppState(O.remove(sectionPrism(sectionIndex))(appState))
  }

  const editSection = (sectionIndex: number) => (section: SectionType) => {
    setAppState(O.set(sectionPrism(sectionIndex))(section)(appState))
  }

  const setSelection = (selection: SelectionType) => {
    setAppState(O.set(rubricSelectionLens)(selection)(appState))
  }

  useEffect(() => {
    if (appState.selection === 'deselect') {
      unselectAll()
      setSelection(null)
    } else if (appState.selection === 'select') {
      selectElement('content')()
    }
  }, [appState.selection])

  const changeLanguage = (event: React.ChangeEvent<{ value: unknown }>) => {
    const language = event.target.value as string
    i18n.changeLanguage(language)
    setAppState(O.set(languageLens)(language)(appState))
  }

  const uploaderRefObject = useRef() as MutableRefObject<HTMLInputElement>

  return (
    <React.Fragment>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Grid container direction="row" spacing={2}>
          <Grid item xs={6}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Grid container spacing={4}>
                  <Grid item>
                    <FormControl>
                      <Select
                        onChange={changeLanguage}
                        value={i18n.language}
                        labelId="change-language-label"
                        id="change-language"
                      >
                        <MenuItem value="fi">
                          <Icon fontSize="small">language</Icon> suomi
                        </MenuItem>
                        <MenuItem value="en">
                          <Icon fontSize="small">language</Icon> English
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      startIcon={<Icon>save_alt</Icon>}
                    >
                      <Link
                        variant={'button'}
                        href={
                          'data:text/json;charset=utf-8,' +
                          encodeURIComponent(
                            JSON.stringify(appState.sections, null, 2)
                          )
                        }
                        download="rubric.json"
                      >
                        {t('saveRubric')}
                      </Link>
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      startIcon={<Icon>open_in_browser</Icon>}
                      onClick={() => uploaderRefObject.current.click()}
                    >
                      <input
                        type="file"
                        accept="text/json"
                        multiple={false}
                        ref={uploaderRefObject}
                        style={{ display: 'none' }}
                        onChange={uploadRubric}
                      ></input>
                      {t('openRubric')}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <div id="content">
                  <RubricView
                    sections={appState.sections}
                    selection={appState.selection}
                  />
                </div>
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={4}>
                  <Grid item>
                    <Button
                      onClick={() => setSelection('select')}
                      variant="contained"
                      color="primary"
                      startIcon={<Icon>content_copy</Icon>}
                    >
                      {t('selectAndCopy')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={() => setSelection('deselect')}
                      variant="contained"
                      startIcon={<Icon>clear</Icon>}
                    >
                      {t('unselect')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={reload}
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
          <Grid item xs={6}>
            <RubricEditor
              sections={appState.sections}
              addSection={addSection}
              removeSection={removeSection}
              editSection={editSection}
              t={t}
            />
          </Grid>
        </Grid>
      </ThemeProvider>
    </React.Fragment>
  )
}

export default App
