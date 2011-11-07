desc 'Deploy'
task :deploy do
  sh 'rsync -rtzh --progress --delete ./ dubslice:/var/www/hypem.tv/'
end
