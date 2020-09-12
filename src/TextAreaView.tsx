import React, { useState } from 'react'
import { SelectionType } from './types'

interface Props {
  title: string
  selection: SelectionType
}

const TextAreaView = (props: Props): JSX.Element => {
  const [value, setValue] = useState('')

  const handleValueChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setValue(event.target.value)
  }

  const valueComponent =
    props.selection === 'select' ? (
      <span>{value}</span>
    ) : (
      <textarea
        rows={4}
        cols={80}
        value={value}
        onChange={handleValueChange}
      ></textarea>
    )

  return (
    <table className="textAreaCriterion">
      <tbody>
        <tr>
          <td className="textAreaCriterionCell">
            <div className="criterionTitle">{props.title}</div>
            <div>{valueComponent}</div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default TextAreaView
