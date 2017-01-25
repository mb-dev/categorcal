import * as React from "react";
import * as moment from "moment";
import * as lodash from "lodash";
import * as TagsInput from "react-tagsinput";
import * as Autosuggest from "react-autosuggest";
import actions from "../actions/actions";

declare let gapi: any;

function updateTags(description, tags) {
  const index = description.indexOf("--autotags:");
  const newTagRow = "--autotags: " + tags.join(" ");
  if (index >= 0) {
    return description.substring(0, index - 1) + newTagRow;
  } else {
    return description + "\n" + newTagRow;
  }
}

interface EventItemProps { className: string; item: any; allTags: any; allPeople: any; }
interface EventItemState { tags: string[]; allSuggestions: string[]; displayedSuggestions: string[]; }
export default class EventItem extends React.Component<EventItemProps, EventItemState> {
  constructor(props) {
    super(props);
    const suggestions = props.allTags.concat(props.allPeople);
    this.state = {
      tags: props.item.metadata.tags.concat(props.item.metadata.people),
      allSuggestions: suggestions,
      displayedSuggestions: suggestions,
    };
  }
  async onUpdate() {
    if (!this.state.tags) {
      return;
    }
    await gapi.client.calendar.events.update({
      calendarId: "primary",
      eventId: this.props.item.id,
      resource: Object.assign({}, this.props.item, {metadata: null, description: updateTags(this.props.item.description, this.state.tags)}),
    });
    actions.fetchEvents();
  }
  async onDelete() {
    if (!confirm("Are you sure you want to delete item?")) {
      return;
    }
    await gapi.client.calendar.events.delete({
      calendarId: "primary",
      eventId: this.props.item.id,
    });
    actions.fetchEvents();
  }
  render() {
    const duration = moment.duration(moment(this.props.item.metadata.end).diff(this.props.item.metadata.start));

    const itemProps = this.props;
    const getSuggestions = (term) => lodash.filter(this.state.allSuggestions, s => lodash.startsWith(s, term));
    const autocompleteRenderInput = (props) => {
      const {addTag, ...otherProps} = props;
      const handleChange = (e, {newValue, method}) => {
        if (method === "enter") {
          e.preventDefault();
        } else {
          props.onChange(e);
        }
      };
      return (<Autosuggest
        ref={props.ref}
        onSuggestionsFetchRequested={({value}) => this.setState({displayedSuggestions: getSuggestions(value)})}
        onSuggestionsClearRequested={() => this.setState({displayedSuggestions: []})}
        suggestions={this.state.displayedSuggestions}
        renderSuggestion={(suggestion) => <span>{suggestion}</span>}
        inputProps={{...otherProps, onChange: handleChange}}
        getSuggestionValue={suggestion => suggestion}
        onSuggestionSelected={(e, {suggestion}) => {
          addTag(suggestion);
        }}
      />);
    };

    return (
      <tr className={this.props.className}>
        <td>
          {this.props.item.summary}
        </td>
        <td>
          {moment(this.props.item.metadata.start).format("MM/DD hh:mma")} {duration.hours()}h
        </td>
        <td>
          <TagsInput renderInput={autocompleteRenderInput} value={this.state.tags} onChange={(tags) => this.setState({tags})} />
        </td>
        <td>
          <button type="button" className="btn btn-danger" onClick={() => this.onDelete()}>Delete</button>
          <button type="button" className="btn btn-default" onClick={() => this.onUpdate()}>Update</button>
        </td>
      </tr>
    );
  }
}

