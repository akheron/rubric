import React from 'react'
import { createSeparatedReactNodes } from './react-utils'
import Clickable from './Clickable'

interface Props {
  title: string
  options: string[]
}

const MultiSelectCriterion = (props: Props): JSX.Element => {
  const clickables = createSeparatedReactNodes(
    props.options,
    (value) => <Clickable key={value} value={value} />,
    (index) => <span key={'separator' + index}> / </span>
  )
  return (
    <div className="criterion">
      <span className="criterionTitle">{props.title}</span>
      <span> </span>
      {clickables}
    </div>
  )
}

export default MultiSelectCriterion
