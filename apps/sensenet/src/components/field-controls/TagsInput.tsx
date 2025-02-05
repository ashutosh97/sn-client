/**
 * @module FieldControls
 */
import { PathHelper } from '@sensenet/client-utils'
import { GenericContent, ReferenceFieldSetting, User } from '@sensenet/default-content-types'
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core'
import Avatar from '@material-ui/core/Avatar'
import Chip from '@material-ui/core/Chip'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormGroup from '@material-ui/core/FormGroup'
import FormLabel from '@material-ui/core/FormLabel'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import React, { Component } from 'react'
import { ReactClientFieldSetting } from './ClientFieldSetting'
import { renderIconDefault } from './icon'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const DEFAULT_AVATAR_PATH = '/Root/Sites/Default_Site/demoavatars/Admin.png'
const menuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

const styles = ({ palette }: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      '& .MuiSelect-root': {
        paddingBottom: 0,
        paddingTop: '9px',
        display: 'flex',
        flexWrap: 'wrap',
      },
      '& .MuiChip-deleteIcon': {
        color: 'rgba(255, 255, 255, 0.26)',
      },
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      backgroundColor: '#0C0C0C',
      color: palette.common.white,
      margin: '0 3px 3px 0',
    },
  })

/**
 * Interface for TagsInput state
 */
export interface TagsInputState {
  dataSource: GenericContent[]
  fieldValue: GenericContent[]
}
/**
 * Field control that represents a Reference field. Available values will be populated from the FieldSettings.
 */
class TagsInputComponent extends Component<
  ReactClientFieldSetting<ReferenceFieldSetting> & WithStyles<typeof styles>,
  TagsInputState
> {
  constructor(props: TagsInputComponent['props']) {
    super(props)
    if (this.props.actionName !== 'new') {
      this.getSelected()
    }
    this.state = {
      dataSource: [],
      fieldValue: [],
    }
    if (this.props.actionName !== 'browse') {
      this.search()
    }
  }

  public handleChange = (event: React.ChangeEvent<{ name?: string; value: number[] }>) => {
    let s: GenericContent[] = []
    this.props.settings.AllowMultiple !== undefined && this.props.settings.AllowMultiple
      ? (s = event.target.value.map((c: number) => this.getContentById(c) as GenericContent))
      : (s = [this.getContentById(event.target.value[1]) as GenericContent])

    this.setState({
      fieldValue: s as GenericContent[],
    })
    this.props.fieldOnChange &&
      this.props.fieldOnChange(
        this.props.settings.Name,
        // eslint-disable-next-line array-callback-return
        s.map((content) => {
          if (content) {
            return content.Id
          }
        }),
      )
  }

  public async search() {
    try {
      if (!this.props.repository) {
        throw new Error('You must pass a repository to this control')
      }
      const selectionRoot = this.props.settings.SelectionRoots || []
      const allowedTypes = this.props.settings.AllowedTypes || ['GenericContent']

      let pathQuery = ''
      selectionRoot.forEach((selectionPath, index) => {
        pathQuery += index === 0 ? `InTree:${selectionPath}` : ` OR InTree:${selectionPath}`
      })
      let typeQuery = ''
      allowedTypes.forEach((type, index) => {
        typeQuery += index === 0 ? `TypeIs:${type}` : ` OR TypeIs:${type}`
      })

      const req = await this.props.repository.loadCollection({
        path: '/Root',
        oDataOptions: {
          query: `(${pathQuery}) AND ${typeQuery}`,
          select: 'all',
        },
      })
      this.setState({
        dataSource: req.d.results,
      })
      if (this.props.actionName !== 'new') {
        this.getSelected()
      }
      return req
    } catch (error) {
      console.error(error.mesage)
    }
  }

  public async getSelected() {
    try {
      if (!this.props.repository) {
        throw new Error('You must pass a repository to this control')
      }
      const loadPath = this.props.content
        ? PathHelper.joinPaths(PathHelper.getContentUrl(this.props.content.Path), '/', this.props.settings.Name)
        : ''
      const references = await this.props.repository.loadCollection<GenericContent>({
        path: loadPath,
        oDataOptions: {
          select: 'all',
        },
      })

      this.setState({
        fieldValue: references.d.results,
      })
      return references.d.results
    } catch (error) {
      console.error(error.message)
    }
  }
  /**
   * returns a content by its id
   */
  public getContentById = (id: number) => {
    return this.state.dataSource.find((item) => item.Id === id)
  }

  public handleDelete = (id: number) => {
    const newValue = this.state.fieldValue.filter((item) => item.Id !== id)
    this.setState({
      fieldValue: newValue,
    })

    this.props.fieldOnChange &&
      this.props.fieldOnChange(
        this.props.settings.Name,
        newValue.map((content) => content.Id),
      )
  }

  /**
   * Get proper value for the Select componet
   */
  public getValue() {
    if (this.props.settings.AllowMultiple) {
      return this.state.fieldValue.length ? this.state.fieldValue.map((c) => c.Id) : []
    }
    return this.state.fieldValue.length ? [this.state.fieldValue[0].Id] : []
  }

  public render() {
    switch (this.props.actionName) {
      case 'new':
      case 'edit':
        return (
          <FormControl
            className={this.props.classes.root}
            key={this.props.settings.Name}
            component={'fieldset' as 'div'}
            required={this.props.settings.Compulsory}>
            <InputLabel required={this.props.settings.Compulsory} htmlFor={this.props.settings.Name}>
              {this.props.settings.DisplayName}
            </InputLabel>
            <Select
              className={this.props.classes.root}
              value={this.getValue()}
              onChange={this.handleChange}
              multiple={this.props.settings.AllowMultiple}
              input={<Input id={this.props.settings.Name} fullWidth={true} />}
              renderValue={() => (
                <>
                  {this.state.fieldValue &&
                    this.state.fieldValue.map((content) =>
                      this.props.repository?.schemas.isContentFromType<User>(content, 'User') ? (
                        <Chip
                          avatar={
                            <Avatar
                              style={{ height: '24px', width: '24px' }}
                              alt={content.DisplayName}
                              src={
                                content.Avatar && content.Avatar.Url
                                  ? `${this.props.repository.configuration.repositoryUrl}${content.Avatar.Url}`
                                  : `${this.props.repository.configuration.repositoryUrl}${DEFAULT_AVATAR_PATH}`
                              }
                            />
                          }
                          key={content.Id}
                          label={content.DisplayName}
                          onDelete={() => this.handleDelete(content.Id)}
                          className={this.props.classes.chip}
                        />
                      ) : (
                        <Chip
                          key={content.Id}
                          label={content.DisplayName}
                          icon={
                            this.props.renderIcon
                              ? this.props.renderIcon(content.Type.toLowerCase())
                              : renderIconDefault(content.Type.toLowerCase())
                          }
                          onDelete={() => this.handleDelete(content.Id)}
                          className={this.props.classes.chip}
                        />
                      ),
                    )}
                </>
              )}
              MenuProps={menuProps}>
              {this.state.dataSource &&
                this.state.dataSource.map((content) => (
                  <MenuItem key={content.Id} value={content.Id}>
                    {content.DisplayName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )
      case 'browse':
      default:
        return this.state.fieldValue && this.state.fieldValue.length > 0 ? (
          <FormControl component={'fieldset' as 'div'}>
            <FormLabel component={'legend' as 'label'}>{this.props.settings.DisplayName}</FormLabel>
            <FormGroup>
              {this.state.fieldValue.map((content: GenericContent, index: number) => (
                <FormControl key={index} component={'fieldset' as 'div'}>
                  <FormControlLabel
                    style={{ marginLeft: 0 }}
                    label={content.DisplayName}
                    control={<span />}
                    key={content.Id}
                  />
                </FormControl>
              ))}
            </FormGroup>
          </FormControl>
        ) : (
          <FormLabel component={'legend' as 'label'}>{this.props.settings.DisplayName}</FormLabel>
        )
    }
  }
}

export const TagsInput = withStyles(styles)(TagsInputComponent)
