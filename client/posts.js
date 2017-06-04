
var path = require('path')
var React = require('react/addons')
var cx = React.addons.classSet
var Link = require('react-router').Link;
var Router = require('react-router');
var _ = require('lodash')
var moment = require('moment')
var SinceWhen = require('./since-when')

var NewPost = require('./new-post');

var ContextMenu = require('./context-menu')
var Rendered = require('./rendered')
var DataFetcher = require('./data-fetcher');
var api = require('./api');


function getDirectoryPath(el) {
  var paths = []
  if ( el.classList.contains('directory') ) {
    paths.push(el.querySelector('.category_name').innerText)
  }

  while ( el = el.parentNode ) {
    if ( el.classList && el.classList.contains('directory') ) {
      paths.push(el.querySelector('.category_name').innerText)
    }
  }
  return paths.reverse();
}


var Posts = React.createClass({
  mixins: [DataFetcher((params) => {
    return {
      tree: api.tree(),
      posts: api.posts().then((posts) =>
        _.sortBy(_.filter(posts, function(post) { return !post.isDiscarded }), ['isDraft', 'date']).reverse()
      )
    }
  })],

  getInitialState: function () {
    return {
      selected: localStorage.getItem('posts_selected'),
      postData: {},
      opened: null
    }
  },

  _onNew: function (post) {
    var posts = this.state.posts.slice()
    posts.unshift(post)
    this.setState({posts: posts})
    Router.transitionTo('post', {postId: post._id})
  },

  _createByContextMenu: function (el) {
    var categories = getDirectoryPath(el)
    this.setState({postData: {categories: categories}})
    this.refs.quickadd.getDOMNode().click()
  },

  goTo: function (id, e) {
    if (e) {
      e.preventDefault()
    }
    Router.transitionTo('post', {postId: id})
  },

  toggleCategory: function (name, e) {
    e.preventDefault()
    e.stopPropagation()
    var index = this.state.opened.indexOf(name)
    var opened = this.state.opened
    !~index ? opened.push(name) : opened.splice(index, 1)
    this.setState({
      "opened": opened
    })
  },

  setSelected: function (id, e) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({selected: id})
    localStorage.setItem('posts_selected', id)
  },

  VisitTreePosts: function (props) {
    return (
      <ul>
        {
          props.branch.children && props.branch.children.map((category, i) =>
            <li key={category._id} className={cx({
                "directory": true,
                "open": ~this.state.opened.indexOf(category.name)
              })} onClick={this.toggleCategory.bind(null, category.name)}>
              <a data-role="directory">
                <i className="fa fa-angle-right"></i>
                <i className="fa fa-archive"></i>
                <CateEditor key={category.id}/>
              </a>
              {this.VisitTreePosts({branch: category, categories: props.categories})}
            </li>
          )
        }
        {
          props.branch.articles && props.branch.articles.map((post, i) => 
            <li key={post._id} className={cx({
                "posts_post": true,
                "posts_post--draft": post.isDraft,
                "posts_post--selected": post._id === this.state.selected
              })}
              onDoubleClick={this.goTo.bind(null, post._id)}
              onClick={this.setSelected.bind(this, post._id)}
            >
              <span className="posts_post-title">
              <i className="fa fa-file-text"></i>
                {post.title}
              </span>
            </li>
          )
        }
      </ul>
    )
  },

  render: function () {
    if (!this.state.posts) {
      return <div className='posts'>Loading...</div>
    }

    var current = this.state.posts.find((post) => {
      return post._id == this.state.selected
    }) || this.state.posts[0] || {}

    !this.state.opened && (this.state.opened = current.categories)

    var url = window.location.href.replace(/^.*\/\/[^\/]+/, '').split('/')
    var rootPath = url.slice(0, url.indexOf('admin')).join('/')

    return <div className="posts">
      <div className='posts_list'>
        <NewPost onNew={this._onNew} postData={this.state.postData} ref="quickadd"/>
        <this.VisitTreePosts branch={this.state.tree}/>        
      </div>

      <div className={cx({
        'posts_display': true,
        'posts_display--draft': current.isDraft,
      })}>
        {current.isDraft && <div className="posts_draft-message">Draft</div>}
        {current.title && <div className="posts_title">
          <h1>{current.title}</h1>
        </div>}
        <Rendered
          ref="rendered"
          className="posts_content"
          text={current.content}/>
      </div>
      <ContextMenu onNew={this._createByContextMenu}/>
    </div>
  }
});

module.exports = Posts;